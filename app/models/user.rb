require_dependency "jwt_denylist"

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :project_memberships
  has_many :projects, through: :project_memberships
  has_many :tasks

  validates :first_name, :last_name, presence: true

  def full_name
    "#{first_name} #{last_name}"
  end

  def token
    token = JWT.encode({ user_id: id, exp: 1.day.from_now.to_i }, Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"])
    puts "token generated => #{token}"
    token
  end

  def self.from_jwt_token(token)
    return nil if token.blank?
    secret = Rails.application.credentials.devise_jwt_secret_key || ENV["DEVISE_JWT_SECRET_KEY"]
    puts "secret: #{secret.inspect}"
    decoded = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
    user_id = decoded["user_id"]
    puts "decoded user_id: #{user_id}"
    find_by(id: user_id)
  rescue JWT::DecodeError => e
    puts "JWT DecodeError: #{e.message}"
    nil
  rescue JWT::ExpiredSignature
    puts "JWT ExpiredSignature"
    nil
  end
end
